package abanobsaid.Smart_Queue.controllers;

import abanobsaid.Smart_Queue.entities.Business;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.BusinessDTO;
import abanobsaid.Smart_Queue.payloads.BusinessResponseDTO;
import abanobsaid.Smart_Queue.services.BusinessService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/businesses")
public class BusinessController {

    @Autowired
    private BusinessService businessService;

    @GetMapping
    public List<BusinessResponseDTO> getAllBusinesses() {
        return businessService.getAllBusinesses()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/my")
    public List<BusinessResponseDTO> getMyBusinesses(@AuthenticationPrincipal User currentUser) {
        return businessService.getMyBusinesses(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{businessId}")
    public BusinessResponseDTO getBusinessById(@PathVariable long businessId) {
        Business business = businessService.findById(businessId);
        return toResponse(business);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BusinessResponseDTO createBusiness(
            @RequestBody @Valid BusinessDTO body,
            @AuthenticationPrincipal User currentUser
    ) {
        Business savedBusiness = businessService.saveBusiness(body, currentUser);
        return toResponse(savedBusiness);
    }

    @PutMapping("/{businessId}")
    public BusinessResponseDTO updateBusiness(
            @PathVariable long businessId,
            @RequestBody @Valid BusinessDTO body,
            @AuthenticationPrincipal User currentUser
    ) {
        Business updatedBusiness = businessService.updateBusiness(businessId, body, currentUser);
        return toResponse(updatedBusiness);
    }

    @DeleteMapping("/{businessId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBusiness(
            @PathVariable long businessId,
            @AuthenticationPrincipal User currentUser
    ) {
        businessService.deleteBusiness(businessId, currentUser);
    }

    private BusinessResponseDTO toResponse(Business business) {
        return new BusinessResponseDTO(
                business.getId(),
                business.getName(),
                business.getDescription(),
                business.getAddress(),
                business.getCity(),
                business.getCategory(),
                business.getOpeningTime() != null ? business.getOpeningTime().toString() : null,
                business.getClosingTime() != null ? business.getClosingTime().toString() : null,
                business.getOwner().getId(),
                business.getOwner().getName(),
                business.isActive()
        );
    }
}