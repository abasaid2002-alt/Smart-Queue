package abanobsaid.Smart_Queue.services;

import abanobsaid.Smart_Queue.entities.Business;
import abanobsaid.Smart_Queue.entities.Role;
import abanobsaid.Smart_Queue.entities.User;
import abanobsaid.Smart_Queue.payloads.BusinessDTO;
import abanobsaid.Smart_Queue.repositories.BusinessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BusinessService {

    @Autowired
    private BusinessRepository businessRepository;

    public List<Business> getAllBusinesses() {
        return businessRepository.findAll();
    }

    public Business findById(long businessId) {
        return businessRepository.findById(businessId)
                .orElseThrow(() -> new RuntimeException("Attività non trovata"));
    }

    public List<Business> getMyBusinesses(User currentUser) {
        return businessRepository.findByOwner(currentUser);
    }

    public Business saveBusiness(BusinessDTO body, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Solo un manager può creare un'attività");
        }

        Business newBusiness = new Business(
                body.name(),
                body.description(),
                body.address(),
                body.city(),
                body.category(),
                currentUser
        );

        return businessRepository.save(newBusiness);
    }

    public Business updateBusiness(long businessId, BusinessDTO body, User currentUser) {
        Business found = findById(businessId);

        checkOwner(found, currentUser);

        found.setName(body.name());
        found.setDescription(body.description());
        found.setAddress(body.address());
        found.setCity(body.city());
        found.setCategory(body.category());

        return businessRepository.save(found);
    }

    public void deleteBusiness(long businessId, User currentUser) {
        Business found = findById(businessId);

        checkOwner(found, currentUser);

        businessRepository.delete(found);
    }

    private void checkOwner(Business business, User currentUser) {
        if (currentUser.getRole() != Role.MANAGER) {
            throw new RuntimeException("Solo un manager può gestire un'attività");
        }

        if (business.getOwner().getId() != currentUser.getId()) {
            throw new RuntimeException("Non puoi modificare questa attività");
        }
    }
}